const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(
      req.params.id,
    );
    if (!doc) {
      return next(
        new AppError(
          'no document not found with that id',
          404,
        ),
      );
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.UpdateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedDoc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedDoc) {
      return next(
        new AppError(
          'document not found with that id',
          404,
        ),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        updatedDoc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // Tour.findOne({_id: req.params.id});
    if (!doc) {
      return next(
        new AppError(
          'document not found with that id',
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    //to allow for nasted get reviews on tour ((hack))
    // let filter = {};
    // if (req.params.tourId)
    //   filter = { tour: req.params.tourId };

    const features = new APIFeatures(
      Model.find(),
      req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
