FactoryBot.define do
  factory :transfer do
    association :player
    association :transfer_listing
    association :from_team, factory: :team
    association :to_team,   factory: :team
    price              { 1_000_000.00 }
    market_value_after { 1_200_000.00 }
  end
end
