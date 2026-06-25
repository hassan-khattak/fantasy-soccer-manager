FactoryBot.define do
  factory :team do
    association :user
    name    { "#{Faker::Address.city} FC" }
    country { Faker::Address.country }
    budget  { rand(2_000_000.0..5_000_000.0).round(2) }
  end
end
