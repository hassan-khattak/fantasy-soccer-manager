class ApplicationController < ActionController::API
  before_action :authenticate_user!

  NotAuthorizedError = Class.new(StandardError)

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from NotAuthorizedError,           with: :forbidden

  private

  def not_found
    render json: { error: 'Not found' }, status: :not_found
  end

  def forbidden
    render json: { error: 'Forbidden' }, status: :forbidden
  end
end
