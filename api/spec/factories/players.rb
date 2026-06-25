FactoryBot.define do
  factory :player do
    association :team
    first_name   { Faker::Name.first_name }
    last_name    { Faker::Name.last_name }
    country      { Faker::Address.country }
    position     { Player::POSITIONS.sample }
    birth_date   { Faker::Date.between(from: 40.years.ago, to: 18.years.ago) }
    market_value { 1_000_000.00 }
    goals        { rand(0..200) }
  end
end
