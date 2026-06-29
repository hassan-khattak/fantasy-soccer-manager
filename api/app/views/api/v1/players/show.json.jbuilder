json.partial! 'api/v1/players/player', player: @player
json.transfers @player.transfers.order(created_at: :desc),
               partial: 'api/v1/transfers/transfer', as: :transfer
