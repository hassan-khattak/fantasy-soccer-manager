# Development seed — 2 users available immediately for Slice 2 work
# Idempotent: safe to run multiple times

[
  { email: 'dev1@example.com', password: 'password123' },
  { email: 'dev2@example.com', password: 'password123' }
].each do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |u|
    u.password = attrs[:password]
  end
  puts "Seeded user: #{attrs[:email]}"
end
