# SOPS Encrypted Secrets Management
# Decrypt local secrets and run app
run:
	eval "$$(sops decrypt --input-type dotenv --output-type dotenv secrets.local.env.enc)" && npm run dev

# Just decrypt and export to current shell (pipe to eval)
decrypt:
	@sops decrypt --input-type dotenv --output-type dotenv secrets.local.env.enc

decrypt-local:
	@sops decrypt --input-type dotenv --output-type dotenv secrets.local.env.enc

decrypt-production:
	@sops decrypt --input-type dotenv --output-type dotenv secrets.production.env.enc

decrypt-vercel:
	@sops decrypt --input-type dotenv --output-type dotenv secrets.vercel.env.enc

# Re-encrypt after editing secrets
encrypt-local:
	sops encrypt --input-type dotenv --output-type dotenv .env.local > secrets.local.env.enc

encrypt-production:
	sops encrypt --input-type dotenv --output-type dotenv .env.production > secrets.production.env.enc

encrypt-vercel:
	sops encrypt --input-type dotenv --output-type dotenv .env.vercel > secrets.vercel.env.enc
