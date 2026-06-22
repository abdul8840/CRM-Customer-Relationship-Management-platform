const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class BaseController {
  constructor(service) { this.service = service; }
  list = asyncHandler(async (req, res) => {
    const data = await this.service.list(req.user, req.query);
    res.json(new ApiResponse(200, data));
  });
  get = asyncHandler(async (req, res) => {
    const data = await this.service.get(req.user, req.params.id);
    res.json(new ApiResponse(200, data));
  });
  create = asyncHandler(async (req, res) => {
    const data = await this.service.create(req.user, req.body);
    res.status(201).json(new ApiResponse(201, data, 'Created'));
  });
  update = asyncHandler(async (req, res) => {
    const data = await this.service.update(req.user, req.params.id, req.body);
    res.json(new ApiResponse(200, data, 'Updated'));
  });
  delete = asyncHandler(async (req, res) => {
    await this.service.delete(req.user, req.params.id);
    res.json(new ApiResponse(200, null, 'Deleted'));
  });
  bulkDelete = asyncHandler(async (req, res) => {
    const count = await this.service.bulkDelete(req.user, req.body.ids);
    res.json(new ApiResponse(200, { count }, 'Deleted'));
  });
}

module.exports = BaseController;