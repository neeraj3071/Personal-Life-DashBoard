-- Restored local migration to match database history after the Apple Health feature was rolled back from source.
CREATE TABLE "health_imports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sample_type" TEXT NOT NULL,
    "sample_id" TEXT NOT NULL,
    "payload" JSONB,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_imports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "health_imports_user_id_provider_sample_type_sample_id_key" ON "health_imports"("user_id", "provider", "sample_type", "sample_id");

ALTER TABLE "health_imports" ADD CONSTRAINT "health_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;