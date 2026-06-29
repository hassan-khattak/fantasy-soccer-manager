Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Required for Devise to mix authenticate_user! into controllers (skip generates no extra routes)
  devise_for :users, skip: :all

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      namespace :auth do
        post   'register', to: 'registrations#create'
        post   'login',    to: 'sessions#create'
        post   'refresh',  to: 'sessions#refresh'
        delete 'logout',   to: 'sessions#destroy'
      end
      resource  :team,    only: [:show, :update]
      resources :players, only: [:show, :update]
      resources :transfer_listings, only: [:index, :create, :destroy] do
        member do
          post :buy
        end
      end
    end
  end
end
