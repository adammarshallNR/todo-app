import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import {
  trace,
  context,
  SpanStatusCode,
  SpanKind,
  ROOT_CONTEXT,
  type Span,
  type Tracer,
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  ATTR_TEST_CASE_NAME,
  ATTR_TEST_CASE_RESULT_STATUS,
  ATTR_TEST_SUITE_NAME,
  ATTR_CODE_FILEPATH,
  ATTR_CODE_LINENO,
  ATTR_CODE_COLUMN,
} from '@opentelemetry/semantic-conventions/incubating';

const propagator = new W3CTraceContextPropagator();

function getParentContext() {
  if (process.env.TRACEPARENT) {
    return propagator.extract(
      ROOT_CONTEXT,
      { traceparent: process.env.TRACEPARENT },
      { get: (carrier, key) => carrier[key as keyof typeof carrier] ?? null, keys: (carrier) => Object.keys(carrier) }
    );
  }
  return ROOT_CONTEXT;
}

class OtelReporter implements Reporter {
  private config!: FullConfig;
  private tracer!: Tracer;
  private suiteSpan: Span | null = null;
  private suiteCtx = ROOT_CONTEXT;
  private testSpans: Record<string, Span> = {};
  private stepSpans: Record<string, Span> = {};

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    // Initialise tracer here, after globalSetup has called sdk.start()
    this.tracer = trace.getTracer('playwright-e2e');
    const parentCtx = getParentContext();
    this.suiteSpan = this.tracer.startSpan('playwright-test-suite', {
      kind: SpanKind.INTERNAL,
      startTime: new Date(),
    }, parentCtx);
    this.suiteCtx = trace.setSpan(parentCtx, this.suiteSpan);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    const testSpan = this.tracer.startSpan(this.suiteName(test), {
      kind: SpanKind.INTERNAL,
      startTime: result.startTime,
    }, this.suiteCtx);
    this.testSpans[test.id] = testSpan;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const testSpan = this.testSpans[test.id];
    if (!testSpan) return;

    const isPassing = result.status === 'skipped' || result.status === test.expectedStatus;
    const isFlaky = isPassing && result.retry > 0;
    const project = test.parent.project();
    testSpan.setAttributes({
      [ATTR_TEST_CASE_NAME]: this.formatTitle(test),
      [ATTR_TEST_CASE_RESULT_STATUS]: isPassing ? 'pass' : 'fail',
      [ATTR_TEST_SUITE_NAME]: test.parent.title,
      [ATTR_CODE_FILEPATH]: test.location.file,
      [ATTR_CODE_LINENO]: test.location.line,
      [ATTR_CODE_COLUMN]: test.location.column,
      'browser.name': project?.name ?? 'unknown',
      'test.retry': result.retry,
      'test.flaky': isFlaky,
    });

    if (!isPassing) {
      testSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: result.error?.message ?? '',
      });
    }

    testSpan.end(result.startTime.getTime() + result.duration);
    delete this.testSpans[test.id];
  }

  onStepBegin(test: TestCase, _result: TestResult, step: TestStep) {
    const parentSpan = step.parent
      ? this.stepSpans[this.stepKey(test, step.parent)]
      : this.testSpans[test.id];
    if (!parentSpan) return;

    const ctx = trace.setSpan(context.active(), parentSpan);
    const stepSpan = this.tracer.startSpan(`Step: ${step.title}`, {
      startTime: step.startTime,
    }, ctx);
    this.stepSpans[this.stepKey(test, step)] = stepSpan;
  }

  onStepEnd(test: TestCase, _result: TestResult, step: TestStep) {
    const stepSpan = this.stepSpans[this.stepKey(test, step)];
    if (!stepSpan) return;

    stepSpan.setAttributes({ 'test.step.category': step.category, 'test.step.name': step.title });
    if (step.location) {
      stepSpan.setAttributes({
        [ATTR_CODE_FILEPATH]: step.location.file,
        [ATTR_CODE_LINENO]: step.location.line,
        [ATTR_CODE_COLUMN]: step.location.column,
      });
    }
    if (step.error) {
      stepSpan.setStatus({ code: SpanStatusCode.ERROR, message: step.error.message ?? '' });
    }
    stepSpan.end(step.startTime.getTime() + step.duration);
    delete this.stepSpans[this.stepKey(test, step)];
  }

  async onEnd() {
    this.suiteSpan?.end();
    // Force flush here so the suite span is exported before sdk.shutdown() closes
    // the processor — without this, test spans arrive at New Relic before their parent
    const provider = trace.getTracerProvider();
    if (typeof (provider as any).forceFlush === 'function') {
      await (provider as any).forceFlush();
    }
  }

  printsToStdio() {
    return false;
  }

  private suiteName(test: TestCase) {
    return test.parent.title.replace(/\.[^.]+$/, '');
  }

  private formatTitle(test: TestCase) {
    return `${this.suiteName(test)} > ${test.title}`;
  }

  private stepKey(test: TestCase, step: TestStep) {
    return `${test.id}:${step.title}:${step.startTime.getTime()}`;
  }
}

export default OtelReporter;
