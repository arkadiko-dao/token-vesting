;; Implement the `ft-trait` trait defined in the `ft-trait` contract
(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token xyz-token)

;; get the token balance of owner
(define-read-only (get-balance (owner principal))
  (begin
    (ok (ft-get-balance xyz-token owner))))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply xyz-token)))

;; returns the token name
(define-read-only (get-name)
  (ok "XYZ Token"))

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "XYZ"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u8))

;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (if (is-eq tx-sender sender)
    (begin
      (try! (ft-transfer? xyz-token amount sender recipient))
      (print memo)
      (ok true)
    )
    (err u4)))

(define-public (get-token-uri)
  (ok (some u"https://xyz.xyz")))

;; Mint some tokens when deployed
(ft-mint? xyz-token u100000000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(ft-mint? xyz-token u100000000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
