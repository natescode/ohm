'use strict';

// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var common = require('./common');
var errors = require('./errors');
var pexprs = require('./pexprs');

// --------------------------------------------------------------------
// Operations
// --------------------------------------------------------------------

var lexifyCount;

pexprs.PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar) {
  lexifyCount = 0;
  this._assertAllApplicationsAreValid(ruleName, grammar);
};

pexprs.PExpr.prototype._assertAllApplicationsAreValid = common.abstract;

pexprs.anything.assertAllApplicationsAreValid =
pexprs.end.assertAllApplicationsAreValid =
pexprs.Prim.prototype.assertAllApplicationsAreValid =
pexprs.Range.prototype.assertAllApplicationsAreValid =
pexprs.Param.prototype.assertAllApplicationsAreValid =
pexprs.UnicodeChar.prototype.assertAllApplicationsAreValid = function(ruleName, grammar) {
  // no-op
};

pexprs.Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  lexifyCount++;
  this.expr._assertAllApplicationsAreValid(ruleName, grammar);
  lexifyCount--;
};

pexprs.Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  for (var idx = 0; idx < this.terms.length; idx++) {
    this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar);
  }
};

pexprs.Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  for (var idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar);
  }
};

pexprs.Iter.prototype._assertAllApplicationsAreValid =
pexprs.Not.prototype._assertAllApplicationsAreValid =
pexprs.Lookahead.prototype._assertAllApplicationsAreValid =
pexprs.Arr.prototype._assertAllApplicationsAreValid =
pexprs.Str.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  this.expr._assertAllApplicationsAreValid(ruleName, grammar);
};

pexprs.Obj.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  for (var idx = 0; idx < this.properties.length; idx++) {
    this.properties[idx].pattern._assertAllApplicationsAreValid(ruleName, grammar);
  }
};

pexprs.Apply.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
  var body = grammar.ruleDict[this.ruleName];

  // Make sure that the rule exists
  if (!body) {
    throw new errors.UndeclaredRule(this.ruleName, grammar.name, this);
  }

  // ... and that this application is allowed
  if (common.isSyntactic(this.ruleName) && (!common.isSyntactic(ruleName) || lexifyCount > 0)) {
    throw new errors.ApplicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
  }

  // ... and that this application has the correct number of parameters
  var actual = this.params.length;
  var expected = body.formals.length;
  if (actual !== expected) {
    throw new errors.WrongNumberOfParameters(this.ruleName, expected, actual, this);
  }

  // ... and that all of the parameter expressions only have valid applications and have arity 1
  var self = this;
  this.params.forEach(function(param) {
    param._assertAllApplicationsAreValid(ruleName, grammar);
    if (param.getArity() !== 1) {
      throw new errors.InvalidParameter(self.ruleName, param);
    }
  });
};
