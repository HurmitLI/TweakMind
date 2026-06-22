# TweakMind Product Bible

**Version:** 1.0  

**Status:** LOCKED

> This document defines how TweakMind makes product decisions.

>

> It inherits from `docs/00_PROJECT_CONTEXT.md`.

>

> It does not redefine the product constitution.

>

> Whenever uncertainty exists, `PROJECT_CONTEXT.md` always takes precedence.

---

# Purpose

The Product Bible translates constitutional philosophy into product decisions.

It answers questions such as:

- How should features be designed?

- How should AI behave?

- How should UX behave?

- How should optimization decisions be presented?

- How should terminology be displayed?

- How should new ideas be evaluated?

This document defines the permanent product rules that shape every future feature.

---

# Product Decision Principle

Every decision should begin with one question:

> Does this help users make better optimization decisions?

Not:

- Does this make the interface look better?

- Does this demonstrate AI capability?

- Does this increase feature count?

- Does this impress users?

The quality of an optimization platform is determined by the quality of the decisions it helps users make.

---

# Product Experience Principles

Every interaction inside TweakMind should increase user confidence.

The purpose of the product is not to reduce clicks.

The purpose of the product is to reduce uncertainty.

Users should leave every interaction feeling more informed than before.

Optimization should never feel like gambling.

Confidence is a product feature,

not merely a product outcome.

---

# Product Structure

TweakMind consists of four permanent layers.

```

Optimization

↓

Understanding

↓

Decision

↓

Execution

```

Every feature should primarily strengthen one of these layers.

A feature that does not clearly belong to at least one layer should be reconsidered.

---

# Knowledge Before Interface

Interface design follows a simple principle.

```

Knowledge

↓

Decision

↓

Action

```

Users should first understand.

Then evaluate.

Then decide.

Only then should they perform an action.

The interface exists to support this sequence.

It should never reverse it.

---

# Product Flow

Every optimization follows the same fundamental workflow.

```

Discover

↓

Understand

↓

Evaluate

↓

Decide

↓

Apply

↓

Verify

↓

Recover (if necessary)

```

No optimization should bypass this flow.

---

# Core Product Unit

The Optimization Detail Page is the fundamental product unit of TweakMind.

An optimization is not merely a switch.

Every optimization should exist as a dedicated detail page where users can:

- understand the optimization

- evaluate its benefits

- understand its risks

- review recommendations

- compare alternatives

- decide whether to apply it

- learn how to recover

The switch is only the final action.

The detail page is where the product experience happens.

---

# Feature Rules

Every feature should satisfy the following rules.

## Rule 1

The feature must improve optimization.

If it does not improve optimization,

it should not exist.

---

## Rule 2

The feature must improve decision quality.

Providing more buttons is not the same as providing better decisions.

---

## Rule 3

The feature must explain itself.

Every feature should answer:

- What does it do?

- Why does it exist?

- When should it be used?

- Who should use it?

- What are the risks?

- How can it be reversed?

---

## Rule 4

The feature must be recoverable.

Recovery is part of the feature,

not an afterthought.

---

## Rule 5

The feature must be predictable.

Users should understand what will happen before anything changes.

The software should never surprise the user.

---

## Rule 6

The feature should not exist simply because it is technically possible.

Technical capability is never sufficient justification.

---

# UX Principles

## Progressive Understanding

Users should receive information gradually.

Do not overwhelm beginners.

Do not limit advanced users.

---

## Explain Before Acting

Actions should never appear before understanding.

Explanation comes first.

Execution comes second.

---

## Visible Consequences

Whenever possible,

users should immediately understand:

- what will change

- what will remain unchanged

- what can go wrong

---

## Minimize Cognitive Load

Interfaces should reduce unnecessary thinking.

They should never reduce understanding.

---

## Consistency

Identical concepts should always behave identically.

Users should never need to relearn the interface.

---

# AI Principles

AI is an assistant.

AI is never the decision maker.

AI may recommend.

AI may never decide.

Its responsibilities include:

- explaining

- comparing

- recommending

- summarizing

- educating

- answering questions

AI should never:

- silently optimize

- hide technical details

- exaggerate benefits

- invent certainty

- replace user choice

---

# AI Recommendation Rules

Every AI recommendation should include:

- recommendation

- reason

- expected benefit

- possible downside

- applicable users

- confidence level

Recommendations should explain uncertainty whenever uncertainty exists.

---

# AI Explanation Rules

AI explanations should adapt to user knowledge.

However,

the underlying facts must never change.

Different users receive different explanations,

not different truths.

---

# Terminology Rules

TweakMind supports three terminology modes.

## Original

Use official Microsoft or industry terminology.

Suitable for experienced users.

---

## Localized

Use terminology that is commonly understood within the user's language or region.

The goal is familiarity.

---

## TweakMind

Use terminology optimized for understanding.

The purpose of TweakMind terminology is not simplification.

Its purpose is understanding.

Technical accuracy must always be preserved.

---

# Terminology Consistency

A concept has only one meaning.

Terminology modes change presentation,

never meaning.

Terminology changes language,

never behavior.

The same optimization should never have different technical behavior because terminology mode changes.

---

# Optimization Decision Model

Every optimization should provide enough information for users to answer five questions.

## 1

What changes?

---

## 2

Why would someone enable it?

---

## 3

Who should enable it?

---

## 4

What are the risks?

---

## 5

How can it be undone?

If any question cannot be answered,

the optimization is not ready.

---

# Optimization Classification

Every optimization should be classified.

Example dimensions include:

- Performance

- Stability

- Security

- Privacy

- Compatibility

- Battery

- Gaming

- Productivity

Classification helps users understand intent before implementation.

---

# Risk Communication

Every optimization should communicate risk clearly.

Possible examples include:

- Very Low

- Low

- Moderate

- High

Risk descriptions should explain why,

not merely display a label.

---

# Recommendation Philosophy

Recommendations should always be contextual.

There should never be a universal recommendation.

Recommendations depend on:

- hardware

- Windows version

- workload

- user goals

- compatibility requirements

The best optimization is always context-dependent.

---

# Default Philosophy

Defaults should be conservative.

The default choice should maximize confidence rather than performance.

Aggressive optimization should require deliberate user choice.

---

# Scan Philosophy

Scanning is always optional.

Users should always understand:

- what is being scanned

- why it is being scanned

- what is never scanned

Scanning exists to improve recommendations.

It does not exist to collect information.

A scan identifies potential optimization opportunities.

The user decides whether those opportunities should become actions.

---

# Batch Optimization Rules

Batch optimization should never become blind optimization.

Users should always know:

- what will be applied

- why it will be applied

- what was skipped

- what requires attention

A batch operation is a collection of individual informed decisions,

not a replacement for them.

---

# Warnings

Warnings should educate.

A warning should explain:

- what happened

- why it matters

- what users can do

Warnings should never create unnecessary fear.

---

# Recovery Philosophy

Recovery is a first-class product capability.

Every optimization should define:

- recovery method

- recovery difficulty

- expected recovery result

Recovery should be understandable before optimization is applied.

---

# Product Identity Test

Before approving a feature,

ask:

> If this feature existed without explanations,

> would it still represent TweakMind?

If the answer is yes,

it probably belongs to another optimization tool,

not TweakMind.

Understanding is not an accessory.

It is part of the product itself.

---

# Product Boundaries

The following capabilities are outside the scope of TweakMind unless they directly improve optimization decisions.

Examples include:

- file cleaning

- malware removal

- driver management

- hardware monitoring

- generic AI conversation

- unrelated system utilities

These capabilities should not be added solely because users expect them from traditional PC utilities.

---

# Decision Checklist

Before approving a feature, ask:

- Does it improve optimization?

- Does it improve understanding?

- Does it improve decision quality?

- Does it increase user confidence?

- Does it preserve transparency?

- Does it respect user choice?

- Is recovery clearly defined?

- Would the feature still be valuable without AI?

If any answer is uncertain,

the feature requires further design.

---

# Product Quality Standard

A feature is considered complete only when:

- its purpose is clear

- its behavior is predictable

- its risks are explained

- its recovery is documented

- its terminology is consistent

- its AI behavior is defined

- its user experience matches the principles of this document

Implementation alone does not complete a feature.

A feature is complete only when users can confidently decide whether to use it.

---

# Product Learning Philosophy

TweakMind is not only an optimization tool.

It is also an educational product.

Its purpose is not to create long-term dependence.

Its purpose is to help users become increasingly capable of making their own optimization decisions.

Every interaction should leave users slightly more knowledgeable than before.

Over time,

users should become:

- more confident

- more independent

- better at evaluating optimization decisions

- less reliant on guidance

The product succeeds when users need less assistance over time,

not more.

Optimization improves systems.

Education improves users.

TweakMind should do both.

Knowledge is not a by-product of optimization.

It is one of the product's most valuable outcomes.