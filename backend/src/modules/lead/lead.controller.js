const service = require('./lead.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { parse } = require('json2csv');

exports.list = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.list(req.user, req.query))));
exports.get = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.get(req.user, req.params.id))));
exports.create = asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(201, await service.create(req.user, req.body))));
exports.update = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.update(req.user, req.params.id, req.body))));
exports.delete = asyncHandler(async (req, res) => { await service.delete(req.user, req.params.id); res.json(new ApiResponse(200, null, 'Deleted')); });
exports.assign = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.assign(req.user, req.params.id, req.body.assigned_to))));
exports.convert = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.convert(req.user, req.params.id, req.body))));
exports.stats = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.stats(req.user))));
exports.import = asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.bulkImport(req.user, req.body.rows || []))));
exports.export = asyncHandler(async (req, res) => {
  const data = await service.exportCsv(req.user, req.query);
  const csv = parse(data);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(csv);
});