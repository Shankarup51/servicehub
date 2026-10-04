import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        example: 'umashankar@example.com',
    })
    email: string;

    @ApiProperty({
        example: 'SecurePassword123',
    })
    passwordHash: string;

    @ApiProperty({
        example: 'Umashankar',
    })
    firstName: string;

    @ApiProperty({
        example: 'Prajapati',
        required: false,
    })
    lastName?: string;

    @ApiProperty({
        example: '9876543210',
        required: false,
    })
    phone?: string;
}