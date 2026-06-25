class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :refresh_tokens, dependent: :destroy
  has_one  :team, dependent: :destroy

  def generate_jwt
    Warden::JWTAuth::UserEncoder.new.call(self, :user, nil).first
  end
end
