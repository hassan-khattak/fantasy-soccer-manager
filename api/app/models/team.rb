class Team < ApplicationRecord
  belongs_to :user
  has_many :players, dependent: :destroy
  has_many :transfer_listings, through: :players

  validates :name, presence: true
  validates :country, presence: true
  validates :budget, numericality: { greater_than_or_equal_to: 0 }
end
