package log

// TODO: introduce log formats
// for example: AWS CloudWatch:
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html

// default logger with linked stdout
var logger = New(nil, InfoPrefix)

func Debug(args ...interface{}) {
	logger.Debug(args...)
}

func Debugf(fmtString string, args ...interface{}) {
	logger.Debugf(fmtString, args...)
}

func Error(args ...interface{}) {
	logger.Error(args...)
}

func Errorf(fmtString string, args ...interface{}) {
	logger.Errorf(fmtString, args...)
}

func Info(args ...interface{}) {
	logger.Info(args...)
}

func Infof(fmtString string, args ...interface{}) {
	logger.Infof(fmtString, args...)
}

func Warn(args ...interface{}) {
	logger.Warn(args...)
}

func Warnf(fmtString string, args ...interface{}) {
	logger.Warnf(fmtString, args...)
}

func SetDebug(debug bool) {
	logger.SetDebug(debug)
}
