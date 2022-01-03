;; Token Vesting
;;
;; Vesting contract that allows deposit of SIP-010 tokens.
;; Withdraws are unlocked and allowed to a specified
;; set of addresses at a certain schedule and conditions.

;; SIP-010 token trait.
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;;
;; -- Error codes
;;

(define-constant ERR-SHARE-ALREADY-REDEEMED (err u10))
(define-constant ERR-NOT-AUTHORIZED (err u11))
(define-constant ERR-NOT-WHITELISTED (err u12))

;;
;; -- Data
;;

;; Vestings data structure.
;; Stores contract vestings.
(define-map vestings
  { depositor: principal, token: principal }
  { amount: uint, locking-period: uint }
)

;; Shares data structure.
;; Stores vestings shares.
(define-map shares
  { address: principal, token: principal }
  { amount: uint, redeemed: bool }
)

;; Keeps all the token contracts that can be used in the vesting
;; A new contract can be added by Arkadiko DAO
(define-map whitelisted-tokens
 { contract: principal } { whitelisted: bool }
)

;; Current token context.
(define-data-var token-context (optional principal) none)

;;
;; -- Public
;;

;; Deposit tokens.
(define-public (deposit
  (token <ft-trait>)
  (amount uint)
  (locking-period uint)
  (assignees (list 10 (tuple (address principal) (amount uint))))
)
  (let (
    (whitelisted-token (get-whitelisted-token (contract-of token)))
  )
    (asserts! (get whitelisted whitelisted-token) ERR-NOT-WHITELISTED)

    (add-to-vestings token amount locking-period)
    (var-set token-context (some (contract-of token)))
    (map add-to-shares assignees)
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    (ok true)
  )
)

;; Finishes a vest,
;; withdrawing the respective shares.
(define-public (redeem (token <ft-trait>))
  (let (
    (recipient contract-caller)
    (share (get-share {address: tx-sender, token: (contract-of token)}))
    (whitelisted-token (get-whitelisted-token (contract-of token)))
  )
    (asserts! (not (get redeemed share)) ERR-SHARE-ALREADY-REDEEMED)
    (asserts! (get whitelisted whitelisted-token) ERR-NOT-WHITELISTED)

    (unwrap-panic (as-contract (contract-call? token transfer (get amount share) tx-sender recipient none)))
    (mark-share-as-redeemed token)
    (ok true)
  )
)

;; Adds a token to the whitelist
;; Currently can only be called by the Arkadiko DAO
(define-public (whitelist-token (token <ft-trait>))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) ERR-NOT-AUTHORIZED)
    (map-set whitelisted-tokens { contract: (contract-of token) } { whitelisted: true })
    (ok true)
  )
)

;;
;; -- Private
;;

;; Mark share as redeemed.
;; updates the amount to u0 and
;; sets redeemed valur to true.
(define-private (mark-share-as-redeemed (token <ft-trait>))
  (map-set shares
    {address: tx-sender, token: (contract-of token)}
    {amount: u0, redeemed: true}
  )
)

;; Add a deposit to the vestings storage.
(define-private (add-to-vestings (token <ft-trait>) (amount uint) (locking-period uint))
  (map-set vestings
    { depositor: tx-sender, token: (contract-of token) }
    { amount: amount, locking-period: locking-period }
  )
)

;; Add a share to the shares storage.
(define-private (add-to-shares (share (tuple (address principal) (amount uint))))
  (map-set shares
    { address: (get address share), token: (unwrap-panic (var-get token-context)) }
    { amount: (get amount share), redeemed: false }
  )
)

;; Get amount in the shares storage.
(define-private (get-share (key (tuple (address principal) (token principal))))
  (default-to
    {
      amount: u0,
      redeemed: true
    }
    (map-get? shares key)
  )
)

(define-private (get-whitelisted-token (token principal))
  (default-to
    {
      whitelisted: false
    }
    (map-get? whitelisted-tokens { contract: token })
  )
)
