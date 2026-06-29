# Idempotent seed — safe to run multiple times.
# Creates 3 demo users each with a team + 20 players.
# Lists 3 players per team on the transfer market so the buy flow is
# immediately demonstrable between any two users.

USERS = [
  { email: 'dev1@example.com', password: 'password123' },
  { email: 'dev2@example.com', password: 'password123' },
  { email: 'dev3@example.com', password: 'password123' },
].freeze

USERS.each do |attrs|
  user = User.find_or_create_by!(email: attrs[:email]) { |u| u.password = attrs[:password] }
  TeamGeneratorService.call(user) if user.team.nil?
  puts "Seeded user: #{attrs[:email]} — team: #{user.team.name}"
end

# List 3 unlisted players per team (idempotent — skips players already listed)
User.find_each do |user|
  next unless user.team

  unlisted = user.team.players.reject { |p| p.active_listing.present? }
  unlisted.first(3).each do |player|
    price = (player.market_value * rand(1.0..3.0)).round(2)
    TransferListing.find_or_create_by!(player: player, active: true) do |l|
      l.asking_price = price
    end
    puts "  Listed: #{player.first_name} #{player.last_name} @ $#{price}"
  end
end

puts "\nSeed complete. #{User.count} users, #{Team.count} teams, #{TransferListing.active.count} active listings."
