class Transfer < ApplicationRecord
  self.ignored_columns += %w[updated_at]

  belongs_to :player
  belongs_to :transfer_listing
  belongs_to :from_team, class_name: 'Team'
  belongs_to :to_team,   class_name: 'Team'
end
