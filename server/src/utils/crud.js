import { startOfDay, endOfDay } from './dates.js';

/** Remove immutable / server-controlled fields from a request body. */
export const sanitizeBody = (body = {}) => {
  const { user, _id, id, createdAt, updatedAt, __v, ...rest } = body;
  return rest;
};

/**
 * Build a generic, user-scoped CRUD controller to avoid duplication across modules.
 * @param {import('mongoose').Model} Model
 * @param {{ sort?: object, populate?: string|string[], filters?: string[], dateField?: string, beforeCreate?: Function, beforeUpdate?: Function }} options
 */
export const createCrud = (Model, options = {}) => {
  const {
    sort = { createdAt: -1 },
    populate = [],
    filters = [],
    dateField = 'date',
    beforeCreate,
    beforeUpdate,
  } = options;

  const applyPopulate = (query) => {
    const list = Array.isArray(populate) ? populate : [populate];
    return list.reduce((q, path) => q.populate(path), query);
  };

  return {
    list: async (req, res) => {
      const query = { user: req.user._id };

      filters.forEach((key) => {
        if (req.query[key] !== undefined && req.query[key] !== '') query[key] = req.query[key];
      });

      if (req.query.from || req.query.to) {
        query[dateField] = {};
        if (req.query.from) query[dateField].$gte = startOfDay(req.query.from);
        if (req.query.to) query[dateField].$lte = endOfDay(req.query.to);
      }

      const docs = await applyPopulate(Model.find(query).sort(sort));
      res.json(docs);
    },

    getOne: async (req, res) => {
      const doc = await applyPopulate(Model.findOne({ _id: req.params.id, user: req.user._id }));
      if (!doc) return res.status(404).json({ message: 'Record not found' });
      res.json(doc);
    },

    create: async (req, res) => {
      let payload = { ...sanitizeBody(req.body), user: req.user._id };
      if (beforeCreate) payload = await beforeCreate(payload, req);
      const doc = await Model.create(payload);
      res.status(201).json(doc);
    },

    update: async (req, res) => {
      let payload = sanitizeBody(req.body);
      if (beforeUpdate) payload = await beforeUpdate(payload, req);
      const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        payload,
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ message: 'Record not found' });
      res.json(doc);
    },

    remove: async (req, res) => {
      const doc = await Model.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!doc) return res.status(404).json({ message: 'Record not found' });
      res.json({ message: 'Deleted', id: req.params.id });
    },
  };
};
