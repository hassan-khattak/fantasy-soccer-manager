json.id                 transfer.id
json.price              transfer.price.to_s
json.market_value_after transfer.market_value_after.to_s
json.created_at         transfer.created_at.iso8601
json.from_team do
  json.id      transfer.from_team.id
  json.name    transfer.from_team.name
  json.country transfer.from_team.country
end
json.to_team do
  json.id      transfer.to_team.id
  json.name    transfer.to_team.name
  json.country transfer.to_team.country
end
