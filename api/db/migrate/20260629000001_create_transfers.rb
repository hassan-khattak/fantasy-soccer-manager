class CreateTransfers < ActiveRecord::Migration[8.1]
  def change
    create_table :transfers do |t|
      t.references :player,           null: false, foreign_key: true
      t.references :transfer_listing, null: false, foreign_key: true
      t.references :from_team,        null: false, foreign_key: { to_table: :teams }
      t.references :to_team,          null: false, foreign_key: { to_table: :teams }
      t.decimal    :price,            precision: 15, scale: 2, null: false
      t.decimal    :market_value_after, precision: 15, scale: 2, null: false
      t.datetime   :created_at,       null: false
    end
  end
end
