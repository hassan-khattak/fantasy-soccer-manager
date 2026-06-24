Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Required for Devise to mix authenticate_user! into controllers (skip generates no extra routes)
  devise_for :users, skip: :all

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post   'register', to: 'registrations#create'
        post   'login',    to: 'sessions#create'
        post   'refresh',  to: 'sessions#refresh'
        delete 'logout',   to: 'sessions#destroy'
      end
    end
  end
end
