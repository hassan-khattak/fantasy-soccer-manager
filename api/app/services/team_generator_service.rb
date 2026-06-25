class TeamGeneratorService
  SQUAD = { 'GK' => 3, 'DEF' => 6, 'MID' => 6, 'ATT' => 5 }.freeze
  BUDGET_RANGE = (2_000_000.0..5_000_000.0)

  def self.call(user)
    team = user.create_team!(
      name:    "#{Faker::Address.city} FC",
      country: Faker::Address.country,
      budget:  rand(BUDGET_RANGE).round(2)
    )

    SQUAD.each do |position, count|
      count.times do
        team.players.create!(
          first_name:   Faker::Name.first_name,
          last_name:    Faker::Name.last_name,
          country:      Faker::Address.country,
          position:     position,
          birth_date:   Faker::Date.between(from: 40.years.ago, to: 18.years.ago),
          market_value: 1_000_000.00,
          goals:        rand(0..200)
        )
      end
    end

    team
  end
end
