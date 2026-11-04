export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const formattedErrors = issues.map(err => ({
      field: (err.path || []).join('.'),
      message: err.message
    }));
    return res.status(400).json({
      message: formattedErrors[0]?.message || result.error?.message || 'Validation failed',
      errors: formattedErrors
    });
  }
  req.body = result.data;
  next();
};

export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const formattedErrors = issues.map(err => ({
      field: (err.path || []).join('.'),
      message: err.message
    }));
    return res.status(400).json({
      message: formattedErrors[0]?.message || result.error?.message || 'Invalid parameter format',
      errors: formattedErrors
    });
  }
  req.params = result.data;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const formattedErrors = issues.map(err => ({
      field: (err.path || []).join('.'),
      message: err.message
    }));
    return res.status(400).json({
      message: formattedErrors[0]?.message || result.error?.message || 'Invalid query parameter',
      errors: formattedErrors
    });
  }
  Object.defineProperty(req, 'query', {
    value: result.data,
    writable: true,
    enumerable: true,
    configurable: true
  });
  next();
};
