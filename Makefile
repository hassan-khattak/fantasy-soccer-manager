.PHONY: setup test seed down logs

setup:
	docker compose run --rm api bundle exec rails db:create db:migrate db:seed

test:
	docker compose run --rm \
	  -e DATABASE_URL=postgresql://postgres:password@db:5432/fantasy_test \
	  -e RAILS_ENV=test \
	  api bundle exec rails db:create db:migrate
	docker compose run --rm \
	  -e DATABASE_URL=postgresql://postgres:password@db:5432/fantasy_test \
	  -e RAILS_ENV=test \
	  api bundle exec rspec

seed:
	docker compose run --rm api bundle exec rails db:seed

down:
	docker compose down -v

logs:
	docker compose logs -f api
