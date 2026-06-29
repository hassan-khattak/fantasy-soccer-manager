json.id         @team.id
json.name       @team.name
json.country    @team.country
json.budget     @team.budget.to_s
json.team_value @team_value.to_s
json.players    @players, partial: 'api/v1/players/player', as: :player
