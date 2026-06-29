class TransferListing < ApplicationRecord
  belongs_to :player

  validates :asking_price, numericality: { greater_than: 0 }
  validate  :player_not_already_listed, on: :create

  scope :active, -> { where(active: true) }

  private

  def player_not_already_listed
    if TransferListing.active.exists?(player_id: player_id)
      errors.add(:base, 'Player is already listed for sale')
    end
  end
end
