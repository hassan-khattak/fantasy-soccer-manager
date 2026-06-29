json.id           player.id
json.first_name   player.first_name
json.last_name    player.last_name
json.country      player.country
json.position     player.position
json.birth_date   player.birth_date.iso8601
json.age          player.age
json.market_value player.market_value.to_s
json.goals        player.goals
json.is_listed    player.active_listing.present?
if player.active_listing
  json.active_listing do
    json.id           player.active_listing.id
    json.asking_price player.active_listing.asking_price.to_s
  end
else
  json.active_listing nil
end
