# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_29_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "players", force: :cascade do |t|
    t.date "birth_date", null: false
    t.string "country", null: false
    t.datetime "created_at", null: false
    t.string "first_name", null: false
    t.integer "goals", default: 0
    t.string "last_name", null: false
    t.decimal "market_value", precision: 15, scale: 2, null: false
    t.string "position", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id", "position"], name: "index_players_on_team_id_and_position"
    t.index ["team_id"], name: "index_players_on_team_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.decimal "budget", precision: 15, scale: 2, default: "0.0", null: false
    t.string "country", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_teams_on_user_id", unique: true
  end

  create_table "transfer_listings", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.decimal "asking_price", precision: 15, scale: 2, null: false
    t.datetime "created_at", null: false
    t.bigint "player_id", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_transfer_listings_on_active"
    t.index ["player_id"], name: "index_transfer_listings_on_player_id"
    t.index ["player_id"], name: "one_active_listing_per_player", unique: true, where: "(active = true)"
  end

  create_table "transfers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "from_team_id", null: false
    t.decimal "market_value_after", precision: 15, scale: 2, null: false
    t.bigint "player_id", null: false
    t.decimal "price", precision: 15, scale: 2, null: false
    t.bigint "to_team_id", null: false
    t.bigint "transfer_listing_id", null: false
    t.index ["from_team_id"], name: "index_transfers_on_from_team_id"
    t.index ["player_id"], name: "index_transfers_on_player_id"
    t.index ["to_team_id"], name: "index_transfers_on_to_team_id"
    t.index ["transfer_listing_id"], name: "index_transfers_on_transfer_listing_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "players", "teams"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "teams", "users"
  add_foreign_key "transfer_listings", "players"
  add_foreign_key "transfers", "players"
  add_foreign_key "transfers", "teams", column: "from_team_id"
  add_foreign_key "transfers", "teams", column: "to_team_id"
  add_foreign_key "transfers", "transfer_listings"
end
