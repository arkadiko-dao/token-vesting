
;; Token Vesting
;;
;; Vesting contract that allows deposit of SIP-010 tokens.
;; Withdraws are unlocked to a specified set of addresses
;; at a certain schedule and conditions.

;; Treasury map. Stores a "depositor" => "vesting" relation.
(define-map treasury
  principal {token: (optional principal), amount: uint})

;; Deposit function.
(define-public (deposit (token principal) (amount uint))
  (begin
    (map-set treasury tx-sender {token: (some token), amount: amount})
    (ok true)))
