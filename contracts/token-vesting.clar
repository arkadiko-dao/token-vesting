
;; Token Vesting
;;
;; Vesting contract that allows deposit of SIP-010 tokens.
;; Withdraws are unlocked to a specified set of addresses
;; at a certain schedule and conditions.

;; SIP-010 token trait.
(use-trait ft-trait .sip-010-trait.sip-010-trait)

;;
;; -- Data
;;

;; Treasury map.
;; Identify and stores vestings for the contract.
(define-map treasury
  uint {sender: principal, amount: uint, token-contract: principal})

;; Vesting ID.
(define-data-var vesting-id uint u0)

;; Vesting Vault.
(define-data-var vesting-vault principal 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)

;;
;; -- Public
;;

;; Deposit function.
(define-public (deposit (token <ft-trait>) (amount uint))
  (begin
    (map-set treasury
      (get-next-vesting-id)
      {
        sender: tx-sender,
        amount: amount,
        token-contract: (contract-of token)
      })
    (try! (contract-call? token transfer
      amount tx-sender (var-get vesting-vault) none))
    (ok true)))

;;
;; -- Private
;;

;; Next vesting ID.
(define-private (get-next-vesting-id)
  (begin
    (var-set vesting-id (+ (var-get vesting-id) u1)) ;; increments vesting ID by one
    (var-get vesting-id)))
