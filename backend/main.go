package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/config"
	applog "github.com/iv-tunate/PAS/internal/logger"
	"github.com/iv-tunate/PAS/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "error", err)
		os.Exit(1)
	}

	log := applog.New(cfg.Env)

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Error("invalid DATABASE_URL", "error", err)
		os.Exit(1)
	}
	poolConfig.MaxConns = 20
	poolConfig.MinConns = 2
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute
	poolConfig.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Error("could not connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Error("database ping failed", "error", err)
		os.Exit(1)
	}
	log.Info("connected to database")

	e := server.New(cfg, log, pool)

	go func() {
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			log.Error("server failed to start", "error", err)
			os.Exit(1)
		}
	}()
	log.Info("server started", "port", cfg.Port, "env", cfg.Env)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Info("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown failed", "error", err)
	}
	server.Shutdown(ctx, pool)
	log.Info("shutdown complete")
}
