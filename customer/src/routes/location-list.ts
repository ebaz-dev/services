import express, { Request, Response } from "express";
import { validateRequest, Location } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/location/list",
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {};
    const data = await Location.find(criteria).sort("name");
    const cities: any = data
      .filter((location) => {
        return !location.parentId;
      })
      .map((city: any) => {
        const districts: any = data
          .filter((district) => {
            return `${district.parentId}` === `${city._id}`;
          })
          .map((district: any) => {
            const subDistricts = data
              .filter((subDistrict) => {
                return `${subDistrict.parentId}` === `${district._id}`;
              })
              .sort((a, b) => {
                const regex = /^(\d+)/;
                const aMatch = a.name.match(regex);
                const bMatch = b.name.match(regex);
                if (aMatch && bMatch) {
                  return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                } else if (aMatch) {
                  return 1;
                } else if (bMatch) {
                  return -1;
                } else {
                  return a.name.localeCompare(b.name);
                }
              });
            return {
              id: district._id,
              parentId: district.parentId,
              name: district.name,
              lat: district.lat,
              long: district.long,
              subDistricts,
            };
          });
        return {
          id: city._id,
          parentId: city.parentId,
          name: city.name,
          lat: city.lat,
          long: city.long,
          districts,
        };
      });
    res.status(StatusCodes.OK).send({ data: cities });
  }
);

export { router as locationListRouter };
