# TweakMind Engineering Guide

**Version:** 1.0  

**Status:** LOCKED

> This document defines the official engineering standards of TweakMind.

>

> It inherits from:

>

> - `docs/00_PROJECT_CONTEXT.md`

> - `docs/01_PRODUCT_BIBLE.md`

> - `docs/02_MVP_SPEC.md`

> - `docs/03_PROJECT_STATUS.md`

>

> This document defines how TweakMind must be engineered.

>

> It is not a product document.

>

> It is not a development log.

>

> It does not redefine product philosophy.

>

> Every future Development, Review, and Release must follow this document.

---

# Architecture Principles

The architecture must always follow the same flow.

```

Knowledge

↓

Scan

↓

Decision

↓

Apply

↓

Verify

↓

Recover

```

Business logic must never exist inside the UI.

The UI is responsible only for rendering and user interaction.

---

# Project Structure

## Official Documents

```

/docs

```

---

## Application

```

/src

```

---

## Native Layer

```

/src-tauri

```

---

## Knowledge

```

/src/core/knowledge

```

---

## SDK

```

/src/core/sdk

```

---

## Scan

```

/src/core/scan

```

---

## Engine

```

/src/core/engine

```

---

# Development Workflow

Every feature must follow the same workflow.

```

Design

↓

Implementation

↓

Verification

↓

Review

↓

Commit

↓

Push

↓

Update Project Status

```

Project status must always be updated after development is completed.

---

# Optimization Architecture

Every optimization must contain the following components.

- Definition

- Detector

- Evaluator

- Executor

- Recovery

- Knowledge

Responsibilities:

- **Definition** describes the optimization.

- **Detector** reads Windows.

- **Evaluator** generates recommendations.

- **Executor** performs changes.

- **Recovery** restores previous state.

- **Knowledge** explains everything.

Each component has a single responsibility.

---

# Knowledge Architecture

Knowledge owns:

- Why

- Benefits

- Trade-offs

- Risk

- Recovery

- Recommended Users

- Not Recommended Users

- Impact

Knowledge must never contain execution logic.

Knowledge exists independently of implementation.

---

# Scan Architecture

The scan pipeline always follows this sequence.

```

Analyze

↓

ScanManager

↓

Optimization Registry

↓

Detector

↓

Evaluator

↓

ScanResult

↓

Report

```

Each stage has a single responsibility.

---

# Decision Architecture

Decision pages consume:

```

Knowledge

+

ScanResult

```

Decision pages never execute detection.

Decision pages present information only.

---

# Apply Architecture

Apply pages never modify Windows directly.

All execution must go through the Executor.

Execution logic must remain centralized.

---

# Recovery Architecture

Recovery always restores through the Recovery module.

Recovery logic must never exist inside the UI.

Recovery should use the same architectural standards as execution.

---

# Code Rules

- Business logic is forbidden inside React pages.

- No duplicated knowledge.

- No duplicated recommendation logic.

- No duplicated detection logic.

- No duplicated execution logic.

- Every module should have a single responsibility.

- Shared logic should remain centralized.

---

# Review Rules

Every PRODUCT and ENGINE must be reviewed.

Every review includes:

- Architecture

- Maintainability

- Performance

- Security

- Scalability

- Technical Debt

- Product Bible Compliance

Reviews should verify compliance with all LOCKED official documents.

---

# Git Workflow

Every completed PRODUCT follows the same workflow.

```

git add .

↓

git commit

↓

git push

↓

Update 03_PROJECT_[STATUS.md](http://STATUS.md)

```

The project status document must always reflect the latest official progress.

---

# Release Workflow

```

Alpha

↓

Beta

↓

RC

↓

1.0

```

Each release stage should reference the current official project status.

---

# Acceptance Criteria

Every completed PRODUCT must provide:

- Files Changed

- Architecture

- Verification

- Screenshots

- Build Result

- Next Development Plan

Completion is defined only after all required deliverables are available.

---

# Rules

This document defines engineering standards only.

It does not define product behavior.

It does not replace the Product Bible.

It does not replace the Project Constitution.

It must remain concise.

Future engineering decisions must inherit from this document unless an official revision is approved.