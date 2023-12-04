import express, { Request, Response } from 'express';

export async function createStackHandler(req: Request, res: Response) {
  const { stackName, templateURL, param_CustomerRoleName, param_VisualithExternalId,region } = req.query as {
    stackName: string;
    templateURL: string;
    param_CustomerRoleName: string;
    param_VisualithExternalId: string;
    region:string;
  };

  const consoleUrl = `https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?param_CustomerRoleName=${encodeURIComponent(param_CustomerRoleName)}&param_VisualithExternalId=${encodeURIComponent(param_VisualithExternalId)}&stackName=${encodeURIComponent(stackName)}&templateURL=${encodeURIComponent(templateURL)}&region=${encodeURIComponent(region)}`;
  console.log(consoleUrl);
  res.redirect(consoleUrl);


}
