class Player < ApplicationRecord
  POSITIONS = %w[GK DEF MID ATT].freeze

  belongs_to :team

  validates :first_name,   presence: true
  validates :last_name,    presence: true
  validates :country,      presence: true
  validates :position,     presence: true, inclusion: { in: POSITIONS }
  validates :birth_date,   presence: true
  validates :market_value, numericality: { greater_than: 0 }

  def age
    ((Date.today - birth_date) / 365.25).floor
  end
end
