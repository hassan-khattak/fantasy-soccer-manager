class CreateTransferListings < ActiveRecord::Migration[8.1]
  def change
    create_table :transfer_listings do |t|
      t.references :player, null: false, foreign_key: true
      t.decimal :asking_price, precision: 15, scale: 2, null: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :transfer_listings, :active
    add_index :transfer_listings, :player_id,
              unique: true,
              where: 'active = true',
              name: 'one_active_listing_per_player'
  end
end
