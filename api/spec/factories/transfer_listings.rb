FactoryBot.define do
  factory :transfer_listing do
    association :player
    asking_price { 2_000_000.00 }
    active       { true }
  end
end
