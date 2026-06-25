# frozen_string_literal: true

class CreateTeams < ActiveRecord::Migration[8.1]
  def change
    create_table :teams do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string     :name,    null: false
      t.string     :country, null: false
      t.decimal    :budget,  precision: 15, scale: 2, null: false, default: 0

      t.timestamps
    end
  end
end
