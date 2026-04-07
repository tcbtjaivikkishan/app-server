import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    const cleanId = id.replace(/[^a-fA-F0-9]/g, '');

    console.log('Clean ID:', cleanId);
    console.log('Length:', cleanId.length);

    return this.usersService.updateUser(cleanId, body);
  }

  @Patch(':id/address')
  addAddress(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addAddress(id, body);
  }
}
