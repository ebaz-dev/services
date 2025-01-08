export enum DeviceTypes {
  Pos = "pos",
  Web = "web",
  IOS = "ios",
  AndroidOS = "android",
}

// Helper type for mobile devices
export const MobileDeviceTypes = [DeviceTypes.IOS, DeviceTypes.AndroidOS];
