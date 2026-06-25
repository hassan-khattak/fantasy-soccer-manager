# frozen_string_literal: true

class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players do |t|
      t.references :team,         null: false, foreign_key: true
      t.string     :first_name,   null: false
      t.string     :last_name,    null: false
      t.string     :country,      null: false
      t.string     :position,     null: false
      t.date       :birth_date,   null: false
      t.decimal    :market_value, precision: 15, scale: 2, null: false
      t.integer    :goals,        default: 0

      t.timestamps
    end

    add_index :players, %i[team_id position]
  end
end
