# Development seed — 2 users with teams for Slice 2+ work
# Idempotent: safe to run multiple times

[
  { email: 'dev1@example.com', password: 'password123' },
  { email: 'dev2@example.com', password: 'password123' }
].each do |attrs|
  user = User.find_or_create_by!(email: attrs[:email]) { |u| u.password = attrs[:password] }
  TeamGeneratorService.call(user) if user.team.nil?
  puts "Seeded: #{attrs[:email]} (team: #{user.team.name})"
end
