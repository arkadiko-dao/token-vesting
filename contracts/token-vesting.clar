
;; Token Vesting
;;
;; Vesting contract that allows deposit of SIP-010 tokens.
;; Withdraws are unlocked and allowed to a specified
;; set of addresses at a certain schedule and conditions.

;; SIP-010 token trait.
(use-trait ft-trait .sip-010-trait.sip-010-trait)

;;
;; -- Error codes
;;

(define-constant share-already-redeemed (err 10))

;;
;; -- Data
;;

;; Vestings data structure.
;; Stores contract vestings.
(define-map vestings
  { depositor: principal, token: principal }
  { amount: uint, locking-period: uint })

;; Shares data structure.
;; Stores vestings shares.
(define-map shares
  (tuple (address principal) (token principal))
  (tuple (amount uint) (redeemed bool)))

;; Current token context.
(define-data-var token-context
  (optional principal) none)

;;
;; -- Public
;;

;; Deposit tokens.
(define-public (deposit
  (token <ft-trait>) (amount uint) (locking-period uint) (assignees (list 10 (tuple (address principal) (amount uint)))))
  (begin
    (add-to-vestings token amount locking-period)
    (var-set token-context (some (contract-of token)))
    (map add-to-shares assignees)
    (try! (contract-call? token transfer
      amount tx-sender (as-contract tx-sender) none))
    (ok true)))

;; Finishes a vest,
;; withdrawing the respective shares.
(define-public (redeem
  (token <ft-trait>))
  (let (
    (recipient contract-caller)
    (share (get-share {address: tx-sender, token: (contract-of token)})))
    (asserts! (not (get redeemed share)) share-already-redeemed)
    (unwrap-panic (as-contract (contract-call? token transfer
      (get amount share) tx-sender recipient none)))
    (mark-share-as-redeemed token)
    (ok true)))

;;
;; -- Private
;;

;; Mark share as redeemed.
;; updates the amount to u0 and
;; sets redeemed valur to true.
(define-private (mark-share-as-redeemed
  (token <ft-trait>))
  (map-set shares
    {address: tx-sender, token: (contract-of token)}
    {amount: u0, redeemed: true}))

;; Add a deposit to the vestings storage.
(define-private (add-to-vestings
  (token <ft-trait>) (amount uint) (locking-period uint))
  (map-set vestings
    {depositor: tx-sender, token: (contract-of token)}
    {amount: amount, locking-period: locking-period}))

;; Add a share to the shares storage.
(define-private (add-to-shares
  (share (tuple (address principal) (amount uint))))
  (map-set shares
    {address: (get address share), token: (unwrap-panic (var-get token-context))}
    {amount: (get amount share), redeemed: false}))

;; Get amount in the shares storage.
(define-private (get-share
  (key (tuple (address principal) (token principal))))
  (unwrap-panic (map-get? shares key)))
