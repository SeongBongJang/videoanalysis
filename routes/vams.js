'use strict'

const express = require('express'),
    router = express.Router(),    
    controller = require('../controller').controller.vams,
    validation = require('../controller').validation.vams,
    fileSystem = require('../controller').validation.fileSystem

module.exports = exports = router

router.post('/deep-shot-boundary-detection', validation.detection.shot, controller.detection.shot)

router.post('/feature-match', validation.match.shot, controller.match.shot)

router.post('/pixel-match', validation.match.pixel, controller.match.pixel)

router.post('/deep-feature-temporal-matching', validation.match.deepFeatureTemporalMatching, controller.match.deepFeatureTemporalMatching)

router.post('/face-detection', validation.detection.face, controller.detection.face)

router.post('/text-detection', validation.detection.text, controller.detection.text)

router.post('/face-recognition', validation.recognition.face, controller.recognition.face)

router.post('/text-recognition', validation.recognition.text, controller.recognition.text)

router.post('/speech-recognition', validation.recognition.speech, controller.recognition.speech)

router.put('/speech-recognition', validation.recognition.speechUpdate, controller.recognition.speechUpdate)

router.post('/trailer', validation.trailer.make, controller.trailer.make)

router.post('/section-thumbnail', validation.intervalThumbnail, controller.intervalThumbnail)

router.post('/transcoder', validation.transcoding, controller.transcoding)

router.post('/shot-clustering', validation.shotClustering, controller.shotClustering)

router.post('/broadcast-record', validation.broadcastRecord, controller.broadcastRecord)

router.post('/feature-generator', validation.generation.feature, controller.generation.feature)

router.post('/train', validation.train, controller.train) // 학습

router.post('/datasets/shot-clustering', validation.datasets.shotClustering, controller.datasets.shotClustering) // 데이터

router.post('/datasets/face-recognition', validation.datasets.faceRecognition, controller.datasets.faceRecognition) // 데이터

router.post('/datasets/text-recognition', validation.datasets.textRecognition, controller.datasets.textRecognition) // 데이터

router.post('/datasets/speech-recognition', validation.datasets.speechRecognition, controller.datasets.speechRecognition) // 데이터

router.get('/metadata/deep-shot-boundary-detection', fileSystem.checkPath, controller.metadata.shotBoundaryDetection)

router.get('/metadata/face-detection', fileSystem.checkPath, controller.metadata.faceDetection)

router.get('/metadata/face-recognition', fileSystem.checkPath, controller.metadata.faceRecognition)

router.get('/metadata/face-recognition-datasets', fileSystem.checkPath, controller.metadata.faceRecognitionDatasets)

router.get('/metadata/face-recognition-accuracy', fileSystem.checkPath, controller.metadata.faceRecognitionAccuracy)

router.get('/', controller.search)

router.delete('/', controller.stop)

router.post('/retransmission', controller.retransmission)