Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'  # development only — tighten to specific origins in production

    resource '*',
      headers: :any,
      expose:  %w[Authorization],
      methods: %i[get post put patch delete options head]
  end
end
