class Player < ApplicationRecord
  POSITIONS = %w[GK DEF MID ATT].freeze

  belongs_to :team
  has_one  :active_listing,
           -> { where(active: true) },
           class_name: 'TransferListing',
           dependent:  :destroy
  has_many :transfer_listings, dependent: :destroy
  has_many :transfers, dependent: :destroy

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
