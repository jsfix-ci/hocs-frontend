const router = require('express').Router();
const { getDocumentList } = require('../middleware/document');
const { fileMiddleware } = require('../middleware/file');
const { processMiddleware } = require('../middleware/process');
const { validationMiddleware } = require('../middleware/validation');
const { caseSummaryMiddleware } = require('../middleware/case');
const { allocateCase } = require('../middleware/stage');
const { getFormForStage } = require('../services/form');

router.get('/:caseId/summary', caseSummaryMiddleware);
router.get('/:caseId/stage/:stageId/allocate', allocateCase);
router.use(['/:caseId/stage/:stageId', '/:caseId/stage/:stageId/allocate'],
    getFormForStage,
    getDocumentList);
router.post(['/:caseId/stage/:stageId', '/:caseId/stage/:stageId/allocate'],
    fileMiddleware.any(),
    processMiddleware,
    validationMiddleware
);

module.exports = router;