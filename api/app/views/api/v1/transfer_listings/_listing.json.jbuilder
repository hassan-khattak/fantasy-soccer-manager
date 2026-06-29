json.id           listing.id
json.asking_price listing.asking_price.to_s
json.created_at   listing.created_at.iso8601
json.player listing.player, partial: 'api/v1/players/player', as: :player
json.team do
  json.id      listing.player.team.id
  json.name    listing.player.team.name
  json.country listing.player.team.country
end
